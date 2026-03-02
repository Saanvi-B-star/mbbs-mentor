import { Request, Response } from 'express';
import { StudyMaterialService } from './studyMaterial.service';

export class StudyMaterialController {
    private service = new StudyMaterialService();

    getAllStudyMaterial = async (req: Request, res: Response) => {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const result = await this.service.getAll(page, limit);

        res.json({
            success: true,
            ...result,
        });
    };

    getStudyMaterialById = async (req: Request, res: Response) => {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: 'ID is required' });
        }
        const material = await this.service.getById(id);

        res.json({
            success: true,
            data: material,
        });
    };
}
